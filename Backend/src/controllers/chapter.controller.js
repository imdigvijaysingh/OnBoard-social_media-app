import chapterModel from "../models/chapter.model.js";
import { postModel } from "../models/post.model.js";
import profileModel from "../models/profile.model.js";

// Create a new chapter
export const createChapter = async (req, res) => {
  try {
    const { title, emoji, timeframe, description, coverImage, isPrivate, postIds } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Chapter title is required" });
    }

    const profile = await profileModel.findOne({ user: req.user.id });

    // Sanitize post IDs if provided
    let validPostIds = [];
    if (Array.isArray(postIds) && postIds.length > 0) {
      validPostIds = postIds;
    }

    // If no cover image provided, try to use the first selected post's image
    let finalCover = coverImage || "";
    if (!finalCover && validPostIds.length > 0) {
      const firstPost = await postModel.findById(validPostIds[0]);
      if (firstPost && firstPost.image) {
        finalCover = firstPost.image;
      }
    }

    const chapter = await chapterModel.create({
      user: req.user.id,
      profile: profile ? profile._id : null,
      title: title.trim(),
      emoji: emoji || "📖",
      timeframe: timeframe ? timeframe.trim() : "",
      description: description ? description.trim() : "",
      coverImage: finalCover,
      isPrivate: !!isPrivate,
      posts: validPostIds,
    });

    // Link posts to this chapter
    if (validPostIds.length > 0) {
      await postModel.updateMany(
        { _id: { $in: validPostIds }, user: req.user.id },
        { $set: { chapter: chapter._id } }
      );
    }

    const populatedChapter = await chapterModel
      .findById(chapter._id)
      .populate("posts", "image caption createdAt mediaType");

    return res.status(201).json({
      message: "Chapter created successfully",
      chapter: populatedChapter,
    });
  } catch (err) {
    console.error("Error creating chapter:", err);
    return res.status(500).json({ message: "Failed to create chapter", error: err.message });
  }
};

// Get current user's chapters
export const getMyChapters = async (req, res) => {
  try {
    const chapters = await chapterModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("posts", "image caption createdAt mediaType likes comments");

    return res.status(200).json({ chapters });
  } catch (err) {
    console.error("Error fetching my chapters:", err);
    return res.status(500).json({ message: "Failed to fetch chapters", error: err.message });
  }
};

// Get chapters for another user
export const getUserChapters = async (req, res) => {
  try {
    const { userId } = req.params;
    const isSelf = req.user?.id?.toString() === userId?.toString();

    const query = { user: userId };
    if (!isSelf) {
      query.isPrivate = false;
    }

    const chapters = await chapterModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate("posts", "image caption createdAt mediaType likes comments");

    return res.status(200).json({ chapters });
  } catch (err) {
    console.error("Error fetching user chapters:", err);
    return res.status(500).json({ message: "Failed to fetch user chapters", error: err.message });
  }
};

// Get single chapter details
export const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await chapterModel
      .findById(id)
      .populate("user", "firstName lastName")
      .populate("profile", "userName profilePhoto")
      .populate({
        path: "posts",
        populate: { path: "profile", select: "userName profilePhoto" },
      });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const isOwner = req.user?.id?.toString() === chapter.user?._id?.toString();
    if (chapter.isPrivate && !isOwner) {
      return res.status(403).json({ message: "This chapter is private" });
    }

    return res.status(200).json({ chapter, isOwner });
  } catch (err) {
    console.error("Error fetching chapter details:", err);
    return res.status(500).json({ message: "Failed to fetch chapter", error: err.message });
  }
};

// Update chapter
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await chapterModel.findOne({ _id: id, user: req.user.id });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found or unauthorized" });
    }

    const { title, emoji, timeframe, description, coverImage, isPrivate, postIds } = req.body;

    if (title) chapter.title = title.trim();
    if (emoji) chapter.emoji = emoji.trim();
    if (timeframe !== undefined) chapter.timeframe = timeframe.trim();
    if (description !== undefined) chapter.description = description.trim();
    if (coverImage !== undefined) chapter.coverImage = coverImage;
    if (isPrivate !== undefined) chapter.isPrivate = !!isPrivate;

    if (Array.isArray(postIds)) {
      // Remove old posts not in new list
      const removedPosts = chapter.posts.filter((p) => !postIds.includes(p.toString()));
      if (removedPosts.length > 0) {
        await postModel.updateMany(
          { _id: { $in: removedPosts } },
          { $set: { chapter: null } }
        );
      }

      // Add new posts
      await postModel.updateMany(
        { _id: { $in: postIds }, user: req.user.id },
        { $set: { chapter: chapter._id } }
      );

      chapter.posts = postIds;
    }

    await chapter.save();

    const updated = await chapterModel
      .findById(chapter._id)
      .populate("posts", "image caption createdAt mediaType");

    return res.status(200).json({
      message: "Chapter updated successfully",
      chapter: updated,
    });
  } catch (err) {
    console.error("Error updating chapter:", err);
    return res.status(500).json({ message: "Failed to update chapter", error: err.message });
  }
};

// Delete chapter
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await chapterModel.findOneAndDelete({ _id: id, user: req.user.id });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found or unauthorized" });
    }

    // Unbind posts from deleted chapter
    await postModel.updateMany({ chapter: id }, { $set: { chapter: null } });

    return res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (err) {
    console.error("Error deleting chapter:", err);
    return res.status(500).json({ message: "Failed to delete chapter", error: err.message });
  }
};

// Add posts to existing chapter
export const addPostsToChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ message: "Please provide an array of post IDs" });
    }

    const chapter = await chapterModel.findOne({ _id: id, user: req.user.id });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found or unauthorized" });
    }

    // Update chapter
    chapter.posts = Array.from(new Set([...chapter.posts.map((p) => p.toString()), ...postIds]));
    if (!chapter.coverImage && postIds.length > 0) {
      const firstPost = await postModel.findById(postIds[0]);
      if (firstPost?.image) chapter.coverImage = firstPost.image;
    }
    await chapter.save();

    // Link posts
    await postModel.updateMany(
      { _id: { $in: postIds }, user: req.user.id },
      { $set: { chapter: chapter._id } }
    );

    const updated = await chapterModel
      .findById(chapter._id)
      .populate("posts", "image caption createdAt mediaType");

    return res.status(200).json({
      message: "Photos added to chapter successfully",
      chapter: updated,
    });
  } catch (err) {
    console.error("Error adding posts to chapter:", err);
    return res.status(500).json({ message: "Failed to add photos to chapter", error: err.message });
  }
};

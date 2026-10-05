import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { postModel } from '../models/post.model.js';
import profileModel from '../models/profile.model.js';

dotenv.config();

const SAMPLE_DISCOVER_ITEMS = [
  {
    mediaType: 'reel',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    caption: 'Chasing endless horizons and crystal blue tides 🌊✨ Would you swim here? #travel #ocean #adventure #wanderlust',
    categoryTags: ['travel', 'nature', 'lifestyle', 'adventure'],
    audioTrack: 'Tropical Chill Waves • Summer Tape',
    viewsCount: 1845000,
    likesCount: 142000,
    pinned: false
  },
  {
    mediaType: 'reel',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    caption: 'Full-stack AI developer setup 2026 💻⚡ Ultra-wide monitor, mechanical tactile switches & dark mode forever. #tech #coding #setup #ai #developer',
    categoryTags: ['tech', 'coding', 'ai', 'developer'],
    audioTrack: 'Cyberpunk Lo-Fi Midnight Beats',
    viewsCount: 1250000,
    likesCount: 98000,
    pinned: false
  },
  {
    mediaType: 'reel',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    caption: 'When the bug you fixed at 2 AM introduces 4 new features that somehow pass QA 😂💀 #comedy #relatable #developer #memes',
    categoryTags: ['comedy', 'memes', 'tech', 'humor'],
    audioTrack: 'Original Audio - Comedy Club Live',
    viewsCount: 940000,
    likesCount: 78500,
    pinned: false
  },
  {
    mediaType: 'reel',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    caption: '5:00 AM discipline hits differently. Push day PR shattered today! Never skip leg day either 🏋️‍♂️🔥 #fitness #gym #motivation #workout',
    categoryTags: ['fitness', 'workout', 'gym', 'health'],
    audioTrack: 'Heavy Bass Phonk Gym Anthem',
    viewsCount: 780000,
    likesCount: 64000,
    pinned: false
  },
  {
    mediaType: 'reel',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    caption: 'Speed painting a neon futuristic cyberpunk alley in 60 seconds 🎨🖌️ Acrylic + Digital composite. #art #design #creative #painting',
    categoryTags: ['art', 'design', 'creative', 'lifestyle'],
    audioTrack: 'Synthwave Neon Rain - Ambient Mix',
    viewsCount: 650000,
    likesCount: 52000,
    pinned: false
  },
  {
    mediaType: 'reel',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    caption: 'Late night Tokyo ramen masterclass 🍜 Secret 18-hour broth and handmade noodles! #food #tokyo #ramen #foodie',
    categoryTags: ['food', 'travel', 'lifestyle', 'cooking'],
    audioTrack: 'Tokyo Street Lo-Fi Jazz Cafe',
    viewsCount: 520000,
    likesCount: 43000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    caption: 'Clean, minimalist mechanical keyboard builds hit differently ⌨️ Lavender switches & custom Japanese keycaps. #tech #mechanicalkeyboards #setup',
    categoryTags: ['tech', 'design', 'lifestyle'],
    audioTrack: 'Original Audio',
    viewsCount: 290000,
    likesCount: 31000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    caption: 'Lost in the rugged trails of Patagonia 🏔️ The most breathtaking mountain pass I have ever conquered. #travel #mountains #wanderlust #nature',
    categoryTags: ['travel', 'nature', 'adventure'],
    audioTrack: 'Acoustic Guitar Sunrise',
    viewsCount: 360000,
    likesCount: 42000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    caption: 'Progress is quiet, consistency is loud. 12-month transformation milestone reached today! 💪 #fitness #bodybuilding #mindset',
    categoryTags: ['fitness', 'workout', 'motivation'],
    audioTrack: 'Original Audio',
    viewsCount: 240000,
    likesCount: 28000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    caption: 'Live in the studio producing my upcoming EP 🎧 Vintage synthesizers meet modern 808s. Drop a 🎵 if you want a sneak peek! #music #producer #beats',
    categoryTags: ['music', 'art', 'creative'],
    audioTrack: 'Midnight Synth Chords Vol. 2',
    viewsCount: 310000,
    likesCount: 35000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    caption: 'Battle station ready for tonight’s tournament 🎮 OLED 240Hz display + custom water-cooled rig. Who is hopping on? #gaming #esports #pcgaming',
    categoryTags: ['gaming', 'tech', 'esports'],
    audioTrack: 'Original Audio',
    viewsCount: 410000,
    likesCount: 49000,
    pinned: false
  },
  {
    mediaType: 'image',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    caption: 'Autumn street style collection 🍂 Layered trench coats, vintage leather boots, and earth tone palettes. #fashion #style #streetwear #outfit',
    categoryTags: ['fashion', 'style', 'lifestyle'],
    audioTrack: 'Parisian Runway Chic Beats',
    viewsCount: 195000,
    likesCount: 22000,
    pinned: false
  }
];

export async function seedDiscoverPostsIfEmpty() {
  try {
    const existingReels = await postModel.countDocuments({ mediaType: 'reel' });
    if (existingReels >= 4) {
      console.log('Discover reels already populated.');
      return;
    }

    const profiles = await profileModel.find({}).limit(6);
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found to seed discover posts.');
      return;
    }

    console.log(`Seeding discover items across ${profiles.length} profiles...`);

    for (let i = 0; i < SAMPLE_DISCOVER_ITEMS.length; i++) {
      const item = SAMPLE_DISCOVER_ITEMS[i];
      const assignedProfile = profiles[i % profiles.length];

      const postData = {
        user: assignedProfile.user,
        profile: assignedProfile._id,
        image: item.thumbnailUrl || item.image,
        mediaType: item.mediaType,
        videoUrl: item.videoUrl || '',
        thumbnailUrl: item.thumbnailUrl || item.image,
        caption: item.caption,
        categoryTags: item.categoryTags,
        audioTrack: item.audioTrack,
        viewsCount: item.viewsCount,
        pinned: item.pinned,
        likes: [assignedProfile.user],
        comments: [
          {
            user: assignedProfile.user,
            profile: assignedProfile._id,
            text: 'Absolute fire content 🔥 Love this vibe!',
            createdAt: new Date(Date.now() - (i + 1) * 3600000)
          }
        ],
        engagementScore: Math.floor(item.viewsCount * 0.4 + item.likesCount * 2.5),
        createdAt: new Date(Date.now() - (i * 2 + 1) * 3600000)
      };

      await postModel.create(postData);
    }

    console.log('Successfully seeded rich discover items!');
  } catch (err) {
    console.error('Error seeding discover items:', err);
  }
}

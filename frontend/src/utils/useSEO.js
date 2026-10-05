import { useEffect } from "react";

/**
 * Custom hook to dynamically manage document metadata for SEO
 */
export const useSEO = ({ title, description, keywords, author = "Digvijay Singh" }) => {
  useEffect(() => {
    // 1. Title tag
    if (title) {
      document.title = `${title} | OnBoard`;
    } else {
      document.title = "OnBoard - The Social Media App for Your Crew";
    }

    // 2. Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute("content", description);
    }

    // 3. Meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.name = "keywords";
      document.head.appendChild(metaKeywords);
    }
    if (keywords) {
      metaKeywords.setAttribute("content", keywords);
    }

    // 4. Meta author
    let metaAuthor = document.querySelector('meta[name="author"]');
    if (!metaAuthor) {
      metaAuthor = document.createElement("meta");
      metaAuthor.name = "author";
      document.head.appendChild(metaAuthor);
    }
    if (author) {
      metaAuthor.setAttribute("content", author);
    }

    // OpenGraph title & description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    if (title) ogTitle.setAttribute("content", `${title} | OnBoard`);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    if (description) ogDesc.setAttribute("content", description);
  }, [title, description, keywords, author]);
};

export default useSEO;

/** Blog + admin config (public). Password is never stored in plain text. */
export const BLOG_CONFIG = {
  owner: "nandish-jha",
  repo: "nandish-jha.github.io",
  branch: "main",
  postsPath: "blog/data/posts.json",
  /** SHA-256 of admin password — change via regenerating hash if you rotate it */
  adminHash: "fff4cca88b5af173edddf3bc1ef5232d372d9579e59be16e0f309b8e07f8872b",
  sessionKey: "nj_blog_admin_ok",
  draftKey: "nj_blog_drafts",
};


export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  // if (req.query.secret !== process.env.MY_SECRET_TOKEN) {
  //   return res.status(401).json({ message: "Invalid token" })
  // }

  try {
    const { params } = req.query;
    let path = params.join("/");
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    res.clearPreviewData();
    await res.revalidate(path);

    res.redirect(path);
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error refreshing')
  }
}
          
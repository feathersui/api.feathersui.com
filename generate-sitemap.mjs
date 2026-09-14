import * as fs from "node:fs";
import * as path from "node:path";

let rootDirName = process.argv[2];
if (!rootDirName) {
	console.error(`Root path not specified`);
	process.exit(1);
}

let rootPath = rootDirName;
if (!path.isAbsolute(rootPath)) {
	rootPath = path.resolve(process.cwd(), rootPath);
}
rootPath = path.normalize(rootPath);
rootDirName = path.basename(rootPath);

if (!fs.existsSync(rootPath)) {
	console.error(`Path does not exist: ` + rootPath);
	process.exit(1);
}

let lastMod = new Date();

let sitemap = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

function addFilesFromDirectory(dirPath, baseUrlPathname) {
	for (const currentFileName of fs.readdirSync(dirPath)) {
		if (currentFileName.startsWith(".")) {
			// ignore hidden/config files
			continue;
		}
		const currentFilePath = path.resolve(dirPath, currentFileName);
		const currentURLPath = `${baseUrlPathname.length > 0 ? baseUrlPathname + "/" : ""}${currentFileName}`;
		if (fs.statSync(currentFilePath).isDirectory()) {
			addFilesFromDirectory(currentFilePath, currentURLPath);
			continue;
		}
		if (path.extname(currentFileName) === ".html") {
			sitemap += `  <url>
    <loc>https://api.feathersui.com/${currentURLPath}</loc>
    <lastmod>${lastMod.toISOString()}</lastmod>
  </url>
`;
		}
	}
}

// include only the latest versions of each library in the sitemap
// because google doesn't like duplicate content
const currentVersion = "v1.3.1";
addFilesFromDirectory(path.join(rootPath, currentVersion), currentVersion);
const libraries = [
	path.join("amfio", "v1.0.1"),
	path.join("feathersui-cairngorm", "v1.0.0"),
	path.join("formatters", "v1.0.1"),
	path.join("rpc-services", "v1.0.3"),
	path.join("validators", "v1.0.1"),
]
for (const lib of libraries) {
	addFilesFromDirectory(path.join(rootPath, lib), lib);
}

sitemap += `</urlset>`;

fs.writeFileSync(`sitemap.xml`, sitemap, {encoding: "utf8"});
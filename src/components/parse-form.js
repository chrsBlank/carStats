import formidable from "formidable";
import { mkdir, stat } from "fs/promises";

// https://github.com/codersteps/nextjs_file_uploader/blob/main/lib/parse-form.ts

export const parseForm = async (req, uploadPath, maxFiles, maxFileSize) => {
    return await new Promise(async (resolve, reject) => {
        const uploadDir = `/tmp/uploads/${uploadPath ?? ''}`
        try {
            await stat(uploadDir);
        } catch (e) {
            if (e.code === "ENOENT") {
                await mkdir(uploadDir, { recursive: true });
            } else {
                reject(e);
                return;
            }
        }

        const form = formidable({
            maxFiles: maxFiles ?? 1,
            maxFileSize: maxFileSize ?? 1024 * 1024 * 10, // 10MB
            uploadDir,
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
};
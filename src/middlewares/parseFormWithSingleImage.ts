import { Request, Response, NextFunction } from "express";
import uploadInMemory from "../configs/multerConfig";
import ValidationError from "../errors/ValidationError";

const parseFormWithSingleImage = (fieldName: string = "image") => (req: Request, res:Response, next: NextFunction) => {
    uploadInMemory.single(fieldName)(req, res, async (err) => {
        try {
            if (err && err.code === "LIMIT_FILE_SIZE") {
                next(new ValidationError("Image size exceeded 10MB limit", { [req.file?.fieldname || fieldName]: "Image size exceeded 10MB limit" }));
                return;
            }

            if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
                next(new ValidationError(`${err.field} is not allowed`, { [err.field]: `${err.field} is not allowed` }));
                return;
            }

            if (err) {
                next(err);
                return;
            }

            next();
        } catch (err) {
            next(err);
        }
    });
};

export default parseFormWithSingleImage;

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import AppError from "../errors/AppError";
import DataValidationError from "../errors/DataValidationError";
import NotFoundError from "../errors/NotFoundError";
import EventAttendee from "../models/EventAttendee";
import User, { UserRole } from "../models/User";
import UserToken from "../models/UserToken";
import { UserAuth } from "../types/User";
import { sendVerifyEmail, sendResetPasswordEmail } from "../services/emailService";
import { generateAccessToken, generateRefreshToken, JWT_REFRESH_SECRET } from "../services/authService";

export async function login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Must provide username and password for login.", 400));
    }

    const [error, user] = await asyncWrapper(User.findOne({ email }));

    if (error) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!user) {
        return next(new AppError("Invalid email or password.", 401));
    }

    if (!user.emailVerified) {
        return next(new AppError("Must verify email before logging in.", 403));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return next(new AppError("Invalid email or password.", 401));
    }

    const accessToken = generateAccessToken(user as UserAuth);
    const refreshToken = generateRefreshToken(user as UserAuth);

    res.json({
        accessToken,
        refreshToken,
    });
}

export async function loginMobile(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Must provide username and password for login.", 400));
    }

    const [error, user] = await asyncWrapper(User.findOne({ email }));

    if (error) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!user) {
        return next(new AppError("Invalid email or password.", 401));
    }

    if (!user.emailVerified) {
        return next(new AppError("Must verify email before logging in.", 403));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return next(new AppError("Invalid email or password.", 401));
    }

    if (user.role === UserRole.Guest) {
        const [attendeeError, eventAttendees] = await asyncWrapper(EventAttendee.find({ userId: user.id }).populate("event"));

        if (attendeeError) {
            return next(new AppError("Database error. Please try again later."));
        }

        const today = new Date();
        const hasValidEvent = eventAttendees.some(
            (attendee: any) => attendee?.event?.isActive && new Date(attendee?.event?.endDate) >= today
        );

        if (!hasValidEvent) {
            return next(new AppError("User must have an active event with a valid end date to log in.", 403));
        }
    }

    const accessToken = generateAccessToken(user as UserAuth);
    const refreshToken = generateRefreshToken(user as UserAuth);

    res.json({
        accessToken,
        refreshToken,
    });
}

export async function register(req: Request, res: Response, next: NextFunction) {
    const userData = req.body;
    delete userData.isActive;
    delete userData.role;

    if (userData.password.length < 8 || userData.password.length > 25) {
        return next(new AppError("Password must be between 8 and 25 characters long.", 422));
    }

    const [error, newUser] = await asyncWrapper(User.create(userData));

    if (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            const requiredError = Object.values(error.errors).find((err) => err.kind === "required");

            if (requiredError) {
                return next(new DataValidationError(error, 400));
            }

            return next(new DataValidationError(error));
        }

        if ((error as any).code === 11000) {
            return next(new AppError("Email already exists. Please use a different email.", 409));
        }

        return next(new AppError("Database error. Please try again later."));
    }

    const accessToken = generateAccessToken(newUser as UserAuth);
    const refreshToken = generateRefreshToken(newUser as UserAuth);

    try {
        await sendVerifyEmail(newUser.id, newUser.email);
    } catch (emailError) {
        await User.deleteOne({ _id: newUser.id });
        return next(emailError);
    }

    res.status(201).json({
        user: newUser,
        accessToken,
        refreshToken,
    });
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError("Refresh token required.", 400));
    }

    const verifyToken = (token: string, secret: string) => new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });

    const [error, decoded] = await asyncWrapper(
        verifyToken(refreshToken, JWT_REFRESH_SECRET!),
    );

    if (error) {
        return next(new AppError("Invalid or expired refresh token.", 403));
    }

    const { id } = decoded as { id: string };
    const [userError, user] = await asyncWrapper(User.findById(id).exec());

    if (userError) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!user) {
        return next(new AppError("User not found.", 404));
    }

    const newAccessToken = generateAccessToken(user as UserAuth);
    res.json({ accessToken: newAccessToken });
}

export async function verify(req: Request, res: Response, next: NextFunction) {
    const { token, id } = req.query;

    if (!token || !id) {
        return next(new AppError("Invalid verification link.", 400));
    }

    const [error, userToken] = await asyncWrapper(UserToken.findOne({ userId: id, token }));

    if (error) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!userToken) {
        return next(new AppError("Invalid or expired verification link.", 400));
    }

    const [userError, user] = await asyncWrapper(User.findByIdAndUpdate(id, { emailVerified: true }));

    if (userError) {
        return next(new AppError("Database error. Please try again later.", 500));
    }

    if (!user) {
        return next(new NotFoundError("User not found."));
    }

    res.json({ message: "Email verified successfully." });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email is required.", 400));
    }

    const [error, user] = await asyncWrapper(User.findOne({ email }));

    if (error) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!user) {
        return next(new NotFoundError("No user found with that email address."));
    }

    try {
        await sendResetPasswordEmail(user.id, user.email);
    } catch (emailError) {
        return next(emailError);
    }

    res.json({ message: "Password reset email sent successfully." });
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    const { id, token, newPassword } = req.body;

    if (!id || !token || !newPassword) {
        return next(new AppError("Invalid request. Please provide id, token, and newPassword in the request body.", 400));
    }

    if (newPassword.length < 8 || newPassword.length > 25) {
        return next(new AppError("Password must be between 8 and 25 characters long.", 422));
    }

    const [error, userToken] = await asyncWrapper(UserToken.findOne({ userId: id, token }));

    if (error) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!userToken) {
        return next(new AppError("Invalid or expired token.", 400));
    }

    const [userError, user] = await asyncWrapper(User.findByIdAndUpdate(id, { password: newPassword }, { new: true }));

    if (userError) {
        return next(new AppError("Database error. Please try again later."));
    }

    if (!user) {
        return next(new NotFoundError("User not found."));
    }

    await UserToken.deleteOne({ userId: id, token });

    res.json({ message: "Password reset successfully." });
}

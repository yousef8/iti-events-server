import { Router } from "express";
import authenticateUser from "../middlewares/authenticateUser";
import isAdmin from "../middlewares/isAdmin";
import {
    allAttendees,
    approveAttendee,
    attendeeById,
    deleteAttendee,
    pendingAttendees,
    rejectAttendee,
} from "../controllers/attendeeController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Event Attendees
 *   description: Event attendees management
 */

/**
 * @swagger
 * /attendees:
 *   get:
 *     summary: Get all the attendess of all events [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendees returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventAttendeePopulated'
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateUser, isAdmin, allAttendees);

/**
 * @swagger
 * /attendees/pending:
 *   get:
 *     summary: Get all pending attendees of all events [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendees returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventAttendeePopulated'
 *       500:
 *         description: Internal server error
 */
router.get("/pending", authenticateUser, isAdmin, pendingAttendees);

/**
 * @swagger
 * /attendees/{attendeeId}:
 *   get:
 *     summary: Get individual attendee by id [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Attendee found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendee:
 *                   $ref: '#/components/schemas/EventAttendeePopulated'
 *       400:
 *         description: Invalid attendee id format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: "Invalid attendee id format"
 *               errors: {}
 *       404:
 *         description: Attendee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *             example:
 *               message: "Attendee not found"
 *               errors: {}
 *       500:
 *         description: Internal server error
 */
router.get("/:attendeeId", authenticateUser, isAdmin, attendeeById);

/**
 * @swagger
 * /attendees/{attendeeId}/approve:
 *   post:
 *     summary: Approve attendee to attend event [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Successfully approved attendee and return new attendee info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendee:
 *                   $ref: '#/components/schemas/EventAttendeePopulated'
 *       400:
 *         description: Invalid attendee id format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: "Invalid attendee id format"
 *               errors: {}
 *       404:
 *         description: Attendee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *             example:
 *               message: "Attendee not found"
 *               errors: {}
 *       500:
 *         description: Internal server error
 */
router.post("/:attendeeId/approve", authenticateUser, isAdmin, approveAttendee);

/**
 * @swagger
 * /attendees/{attendeeId}/reject:
 *   post:
 *     summary: Reject attendee to attend event [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       200:
 *         description: Successfully rejected attendee and return new attendee info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendee:
 *                   $ref: '#/components/schemas/EventAttendeePopulated'
 *       400:
 *         description: Invalid attendee id format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: "Invalid attendee id format"
 *               errors: {}
 *       404:
 *         description: Attendee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *             example:
 *               message: "Attendee not found"
 *               errors: {}
 *       500:
 *         description: Internal server error
 */
router.post("/:attendeeId/reject", authenticateUser, isAdmin, rejectAttendee);

/**
 * @swagger
 * /attendees/{attendeeId}:
 *   delete:
 *     summary: Delete attendee [ADMINS ONLY]
 *     tags: [Event Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       204:
 *         description: Successfully deleted attendee
 *       400:
 *         description: Invalid attendee id format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               message: "Invalid attendee id format"
 *               errors: {}
 *       404:
 *         description: Attendee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *             example:
 *               message: "Attendee not found"
 *               errors: {}
 *       500:
 *         description: Internal server error
 */
router.delete("/:attendeeId", authenticateUser, isAdmin, deleteAttendee);
export default router;

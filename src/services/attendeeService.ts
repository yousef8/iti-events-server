import EventAttendee from "../models/EventAttendee";

export const getAllAttendees = async (isApproved: boolean | undefined = undefined) => {
    const attendees = await EventAttendee.find(isApproved !== undefined ? { isApproved } : {}).populate("user").populate("event");
    return attendees;
};

export const getAttendeeById = async (id: string) => {
    const attendee = await EventAttendee.findById(id).populate("user").populate("event");
    return attendee;
};

export const updateAttendeeApprovalStatus = async (attendeeId: string, isApproved: boolean) => {
    const attendee = await EventAttendee.findByIdAndUpdate(attendeeId, { isApproved }, { new: true }).populate("user").populate("event");
    return attendee;
};

export const deleteAttendeeById = async (attendeeId: string) => {
    const attendee = await EventAttendee.findByIdAndDelete(attendeeId);
    return attendee;
};

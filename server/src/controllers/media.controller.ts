import type { RequestHandler } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { authUser } from '../middleware/auth.js';
import { mediaPath } from '../services/media.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';

// GET /api/media/:messageId — streams a voice note / photo, only to members of its conversation.
// Supports HTTP Range requests, so audio seeking works everywhere (Safari requires it).
export const getMedia: RequestHandler = async (req, res, next) => {
  const me = authUser(req)._id;
  const messageId = parseObjectId(req.params.messageId, 'media id');

  const message = await Message.findById(messageId).select('conversation media deletedAt');
  if (!message?.media || message.deletedAt) throw new AppError(404, 'Not found');

  const isMember = await Conversation.exists({ _id: message.conversation, 'members.user': me });
  if (!isMember) throw new AppError(404, 'Not found'); // don't reveal that it exists

  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); // files never change
  res.type(message.media.mimeType);
  res.sendFile(mediaPath(message.media.key), (err) => {
    if (err && !res.headersSent) next(new AppError(404, 'Not found'));
  });
};

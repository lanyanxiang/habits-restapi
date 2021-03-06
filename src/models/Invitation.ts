/*
 * Created by Jimmy Lan
 * Creation Date: 2021-09-02
 * Description:
 *   The invitations collection is created to accommodate test server
 *   requirements. Only users with invitations may sign up in test.
 *   The documents in this collection also records other useful information
 *   for test server users.
 */

import { MongoDocument } from "../types";
import mongoose, { Model, Schema } from "mongoose";

interface InvitationProps {
  /** Email of the user invited. */
  email: string;
  /** A random code to verify user's identity. This code is required when
   * a test server user fills out surveys and perform other activities that
   * is outside the scope of this program. */
  code: string;
  /** Indicates whether this invitation has been accepted. */
  isAccepted?: boolean;
  clientIP?: string;
  /** Timestamp when the user accepted this invitation and begin their test
   * session. */
  testSessionStartAt?: Date;
  /** Timestamp of the expiry time of user account. If empty, this test account
   * will never expire. */
  testSessionExpireAt?: Date;
}

export type InvitationDocument = MongoDocument<InvitationProps>;

const invitationSchema = new Schema<InvitationDocument>(
  {
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
    },
    clientIP: String,
    isAccepted: {
      type: Boolean,
      default: false,
    },
    testSessionStartAt: Date,
    testSessionExpireAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
      versionKey: false,
    },
  }
);

export interface InvitationModel extends Model<InvitationDocument> {
  build(props: InvitationProps): InvitationDocument;
}

const build = (props: InvitationProps) => {
  return new Invitation(props);
};
invitationSchema.static("build", build);

export const Invitation = mongoose.model<InvitationDocument, InvitationModel>(
  "Invitation",
  invitationSchema
);

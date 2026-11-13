/** LMS user-avatar multer rules (jpg/jpeg/png/gif/ico/jfif, max 5MB). */
export const AVATAR_EXT = /\.(jpg|jpeg|png|gif|ico|jfif)$/i;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.ico,.jfif,image/jpeg,image/png,image/gif,image/x-icon";

export function assertAvatarFilename(filename: string): void {
  if (!AVATAR_EXT.test(filename)) {
    throw new Error(
      "Profile image must be jpg, jpeg, png, gif, ico, or jfif.",
    );
  }
}

export function assertAvatarByteLength(byteLength: number): void {
  if (byteLength > AVATAR_MAX_BYTES) {
    throw new Error("Profile image must be 5MB or smaller.");
  }
}

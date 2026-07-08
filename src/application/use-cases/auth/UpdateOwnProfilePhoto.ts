import { UserRepository } from "@/domain/repositories/UserRepository";
import { PublicUser, toPublicUser } from "@/domain/entities/User";

export class UpdateOwnProfilePhoto {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: number, photo: string | null): Promise<PublicUser | null> {
    const updated = await this.userRepository.updatePhoto(userId, photo);
    return updated ? toPublicUser(updated) : null;
  }
}

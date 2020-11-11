import { Repository, EntityRepository } from "typeorm";
import { User } from "./user.entity";
import { AuthCredentialsDto } from "./dto/dto-credentials";
import * as bycript from 'bcrypt';
import { ConflictException, InternalServerErrorException } from "@nestjs/common";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    async signUp(authCredentials: AuthCredentialsDto): Promise<void> {
        const { username, password } = authCredentials;

        const user = new User();
        user.username = username;
        user.salt = await bycript.genSalt();
        user.password = await this.hashPassword(password, user.salt);

        try {
            await user.save();
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('Username already exist');
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    private async hashPassword(password: string, salt: string): Promise<string> {
        return bycript.hash(password, salt);
    }

    async validateUserPassword(authCredentials: AuthCredentialsDto): Promise<string> {
        const { username, password } = authCredentials;
        const user = await this.findOne({ username });

        if (user && await user.validatePassword(password)) {
            return user.username;
        } else {
            return null;
        }

    }
}
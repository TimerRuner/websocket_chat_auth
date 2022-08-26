const UserModel = require("../models/user-model")
const bcrypt = require("bcrypt")
const UserDto = require("../dtos/user-dtos")
const TokenService = require("./token-service")

const tokenGenerator = async (user) => {
    const userDto = new UserDto(user)

    const tokens = TokenService.generateToken({ ...userDto })

    await TokenService.saveToken(userDto.id, tokens.refreshToken)
    return {
        ...tokens,
        user: userDto,
    }
}

class UserService {
    async registration(nikname, password) {
        const candidate = await UserModel.findOne({ nikname })
        if (candidate) {
            throw new Error(`User ${nikname} has been registered`)
        }

        const hashPassword = await bcrypt.hash(password, 3)

        const user = await UserModel.create({
            nikname,
            password: hashPassword,
        })

        return tokenGenerator(user)
    }

    async login(nikname, password) {
        const candidate = await UserModel.findOne({ nikname })
        if (!candidate) {
            throw new Error(`User ${nikname} hasn't registered`)
        }

        const isPassEquals = await bcrypt.compare(password, candidate.password)

        if (!isPassEquals) {
            throw new Error(`Password is invalid`)
        }

        return tokenGenerator(candidate)
    }

    async logout(refreshToken) {
        const token = await TokenService.removeToken(refreshToken)
        return token
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new Error(`User anothorized`)
        }

        const userData = TokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await TokenService.findToken(refreshToken)

        if (!userData || !tokenFromDb) {
            throw new Error("User anothorized")
        }

        const user = await UserModel.findById(userData.id)

        return tokenGenerator(user)
    }
}

module.exports = new UserService()

module.exports = class UserDto {
    nikname
    id

    constructor(user) {
        this.nikname = user.nikname
        this.id = user._id
    }
}

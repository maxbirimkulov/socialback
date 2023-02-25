import bcrypt from "bcrypt";
import UserModel from "../models/User.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const password = req.body.password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        const doc = new UserModel({
            phone: req.body.phone,
            login : req.body.login,
            birthday: req.body.birthday,
            city: req.body.city,
            gender: req.body.gender,
            name: req.body.name,
            surname: req.body.surname,
            image: req.body.image,
            passwordHash : hash
        })

        const user = await doc.save()

        const token = jwt.sign({
            _id: user._id
        }, 'secret123' , {expiresIn: '90d'})

        const { passwordHash, ...userData} = user._doc

        res.json({
            ...userData,
            token
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось зарегистрироваться'
        })
    }
}

export const login = async (req, res) => {
    try {
        const user = await UserModel.findOne({login: req.body.login})

        if (!user) {
            return res.status(404).json({
                message: 'Такого аккаунта не существует'
            })
        }

        const inValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash)

        if (!inValidPass) {
            return res.status(404).json({
                message: 'Неверный логин или пароль '
            })
        }

        const token = jwt.sign({
            _id: user._id
        }, 'secret123' , {expiresIn: '30d'})

        const { passwordHash, ...userData} = user._doc

        res.json({
            ...userData,
            token
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось войти'
        })
    }
}


export const getMe = async (req,res) => {
    try {
        const userId = req.params.id
        const user = await UserModel.findById(userId)
        if (!user){
            return res.status(404).json({
                message: 'Пользователь не найден'
            })
        }
        const { passwordHash, ...userData} = user._doc
        res.json(userData)
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Нет доступа'
        })
    }
}


export const getAllUser = async (req, res) => {
    try {

        console.log(req.query)
        let users = await UserModel.find({
            name: new RegExp(req.query.search, 'i')
        });

        // if (req.query.notification) {
        //     let arr = req.query.notification.split(',')
        //     users = users.filter(item => arr.includes(item._id.toString()) )
        // }

        if ('notification' in req.query){
            if (req.query.notification && req.query.notification.length) {
                let arr = req.query.notification.split(',')
                users = users.filter(item => arr.includes(item._id.toString()) )
            } else {
                users = []
            }
        }

        if ('requests' in req.query){
            if (req.query.requests && req.query.requests.length) {
                let arr = req.query.requests.split(',')
                users = users.filter(item => arr.includes(item._id.toString()) )
            } else {
                users = []
            }
        }

        users = Array.from(users).filter((item) => item.login !== req.query.not)



        res.json(users)
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось получить все  статьи'
        })
    }
}


export const sendRequest = async (req, res) => {
    try {
        const userId = req.params.id
        const userIdGet = req.body.request

        let user = await UserModel.findById(userId)
        let userGet = await UserModel.findById(userIdGet)

        UserModel.findByIdAndUpdate({
            _id: userIdGet
        }, {
            notification: [...userGet._doc.notification, userId]
        },{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
        })



        UserModel.findByIdAndUpdate({
            _id: userId
        }, {
            requests: [...user._doc.requests, req.body.request]
        } ,{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
            res.json(doc)
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось получить все  статьи'
        }, {
            returnDocument: 'after',
        })
    }
}


export const cancelMYRequest = async (req, res) => {
    try {



        const senderId = req.body.senderId
        const recieverId = req.body.recieverId

        let sender = await UserModel.findById(senderId)
        let reciever = await UserModel.findById(recieverId)

        UserModel.findByIdAndUpdate({
            _id: recieverId
        }, {
            notification: reciever._doc.notification.filter(item => item !== senderId)
        },{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
        })



        UserModel.findByIdAndUpdate({
            _id: senderId
        }, {
            requests: sender._doc.requests.filter(item => item !== recieverId )
        } ,{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
            res.json(doc)
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось получить все  статьи'
        }, {
            returnDocument: 'after',
        })
    }
}




export const acceptRequest = async (req, res) => {
    try {
        const userId = req.body.recieverId
        const user = await UserModel.findById(userId)

        const senderId = req.body.senderId
        const sender = await UserModel.findById(senderId)

        UserModel.findByIdAndUpdate({
            _id: senderId
        }, {
            requests: sender.requests.filter(item => item !== userId),
            friends: [...sender.friends, userId]
        },{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
        })

        UserModel.findByIdAndUpdate({
            _id: userId
        }, {
            notification : user.notification.filter(item => item !== senderId),
            friends: [...user.friends, senderId]
        } ,{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
            res.json(doc)
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось отправить запрос '
        }, {
            returnDocument: 'after',
        })
    }
}


export const cancelRequest = async (req, res) => {
    try {
        const userId = req.body.recieverId
        const user = await UserModel.findById(userId)

        const senderId = req.body.senderId
        const sender = await UserModel.findById(senderId)

        UserModel.findByIdAndUpdate({
            _id: senderId
        }, {
            requests: sender.requests.filter(item => item !== userId)
        },{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
        })

        UserModel.findByIdAndUpdate({
            _id: userId
        }, {
            notification : user.notification.filter(item => item !== senderId)
        } ,{
            returnDocument: 'after',
        },(err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось отправить заявку'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
            res.json(doc)
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось отправить запрос '
        }, {
            returnDocument: 'after',
        })
    }
}





export const handleFavorites = async (req, res) => {
    try {
        const userId = req.params.id

        console.log(userId)

        UserModel.findByIdAndUpdate({
            _id: userId
        },  {
            favorites: req.body.favorites,
        }, {
            returnDocument: 'after',
        }, (err, doc) => {
            if (err) {
                console.log(err)
                return  res.status(500).json({
                    message: 'Не удалось добавить в избранное'
                })
            }
            if (!doc) {
                return res.status(404).json({
                    message: 'Юзер не найден'
                })
            }
            res.json(doc)
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось добавить в избранное'
        })
    }
}









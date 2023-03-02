import express from 'express'
import multer from 'multer'
import cors from 'cors'
import handleValidatorErrors from "./utils/handleValidatorErrors.js";
import mongoose from 'mongoose'

import {
    acceptRequest, addPhoto, cancelMYRequest,
    cancelRequest,
    getAllUser,
    addPost,
    getMe,
    login,
    register,
    sendRequest
} from "./controllers/UserController.js";


mongoose.connect('mongodb+srv://maxbirimkulov:020599maks@itrunsocial.0y7gues.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('Mongo DB успешно запущен'))
    .catch((err) =>  console.log('Ошибка при запуске Mongo DB ' ,err))


const server = express()

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null,'uploads')
    },
    filename: (_, file, cb) => {
        cb(null,file.originalname)
    }
});

const upload = multer({storage})

server.use(express.json())
server.use(cors())
server.use('/uploads', express.static('uploads'))


const PORT = process.env.PORT || 4444


server.post('/upload',  upload.single('image'), (req, res) => {
    res.json({
        url: `/uploads/${req.file.originalname}`,
    })
})

server.post('/auth/login', handleValidatorErrors, login)
server.post('/auth/register',  register )
server.patch('/users/:id/addphoto', addPhoto)
server.patch('/users/:id/addpost', addPost)
server.get('/users/:id',  getMe )
server.get('/users',  getAllUser )

server.patch('/request/add', acceptRequest)
server.patch('/request/cancel', cancelRequest)
server.patch('/request/mycancel', cancelMYRequest)
server.patch('/request/:id', sendRequest)




server.listen(PORT, (err) => {
    if (err){
        return  console.log('Произошла ошибка', err)
    }
    console.log(`Сервер запущен на порту ${PORT}`)
})
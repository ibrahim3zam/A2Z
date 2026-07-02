import  connectionDB  from "../../DB/connection.js"
import * as routers from '../modules/index.routes.js'
import cors from 'cors'


export const initiatApp = (app,express)=>{
const port = process.env.PORT || 5000
app.use( express.json())
app.use(express.urlencoded({extended:true}))
connectionDB()
app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'))
app.use('/engineer',routers.engineerRouter)
app.use('/admin',routers.adminRouter)
app.use('/user',routers.userRouter)



app.all('*', (req, res, next) =>
res.status(404).json({ message: '404 Not Found URL' }),
)

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isDev = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
      message: err.message || 'Internal Server Error',
      ...(isDev
        ? {
            stack: err.stack,
          }
        : {}),
    });
  });
const httpServer = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

}
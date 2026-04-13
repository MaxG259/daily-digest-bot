import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGODB_URI as string

  await mongoose.connect(uri)
  console.log('✅ MongoDB подключена')
}

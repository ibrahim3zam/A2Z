import mongoose from 'mongoose';

const connectionDB = async () => {
  try {
    await mongoose.connect(process.env.BASE_URL, {});
    console.log('Connected to MongoDB');
    

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process with failure 
  }
};

export default connectionDB;

import { cloudinary } from './src/modules/media/cloudinary';
import { env } from './src/env';

const timestamp = Math.round(new Date().getTime() / 1000);
const folder = "sanacion-en-luz/blog";

const paramsToSign = {
  timestamp,
  folder,
};

const signature = cloudinary.utils.api_sign_request(
  paramsToSign, 
  env.CLOUDINARY_API_SECRET as string
);

console.log("Signature:", signature);

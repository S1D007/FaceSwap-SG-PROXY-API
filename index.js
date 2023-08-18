const express = require('express');
const axios = require('axios');
const cloudinary = require('cloudinary').v2; // Import Cloudinary
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const multer = require('multer');
const FormData = require('form-data');
// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dnoymgexw',
    api_key: '483864432934316',
    api_secret: 'eXckpF0xVVyV_WOdbia4XI_5WxU'
});

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.use(cors());
app.disable('x-powered-by');

app.use((req, res, next) => {
    res.setHeader('x-chalti-ka-namm', `Gadi, number plate: ${req.ip} `);
    next();
});

app.post('/', upload.fields([
    { name: 'input_face_image', maxCount: 1 },
    { name: 'target_face_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const API_KEY = req.headers['x-api-key'];

        const segmindUrl = 'https://api.segmind.com/v1/sd2.1-faceswapper';

        const data = {
            input_face_image: req.files.input_face_image[0].buffer.toString('base64'),
            target_face_image: req.files.target_face_image[0].buffer.toString('base64'),
            file_type: req.files.input_face_image[0].mimetype.split('/')[1]
        };

        const response = await axios.post(segmindUrl, data, {
            headers: {
                'x-api-key': API_KEY
            },
            responseType: 'arraybuffer' // Request the response as an ArrayBuffer huh bakchodi h bhai ek aws server le lete sala 
        });

        // Convert the response data (Blob) to a Buffer and ha yeh madarchod SegMind wale Buffer nhi le rhe hai toh hume khud se Buffer bnana padega and then upload krna padega
        const resultImageBuffer = Buffer.from(response.data);

        // Upload the image to Cloudinary
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
            if (error) {
                res.status(500).json({ error: error.message });
            } else {
                const SG_IMAGE_DATA = new FormData();
                SG_IMAGE_DATA.append('image_url', result.secure_url);
                SG_IMAGE_DATA.append('fix_face_only', '1');
                SG_IMAGE_DATA.append('scale_factor', '4');
                SG_IMAGE_DATA.append('return_type', '1');
                SG_IMAGE_DATA.append('sync', '1');

                // Send enhanced image request
                const EnhancedImage = await axios.post('https://techhk.aoscdn.com/api/tasks/visual/scale', SG_IMAGE_DATA, {
                    headers: {
                        'x-api-key': 'wxcu8h5p89lphwlg6',
                        ...SG_IMAGE_DATA.getHeaders() // Include headers from FormData
                    }
                });
                // console.log(EnhancedImage)
                res.status(200).json({ result: { secure_url: EnhancedImage.data.data.image } });
            }
        }).end(resultImageBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Bakchodi mt kr bc, server is running on port ${port}`);
});
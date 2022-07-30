import dbConnect from '../../../lib/dbConnect';
import Bulletin from '../../../models/Bulletin';

const uploadImage = async (bodyData) => {
    const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: JSON.stringify(bodyData),
        headers: {
            'Content-type': 'application/json',
        },
    });
    const result = await response.json();
    const url = await result.url;
    return url;
};

export default async function handler(req, res) {
    const {
        query: { id },
        method,
    } = req;

    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const bulletin = await Bulletin.findById(id);
                if (!bulletin) {
                    return res.status(400).json({ success: false });
                }
                return res.status(200).json({ success: true, data: bulletin });
            } catch (error) {
                return res.status(400).json({ success: false });
            }

        case 'PUT':
            try {
                const data = req.body;
                // CHECK BANNER IS CHANGED
                // IF BANNER HAS SRC PROPERTY -> BANNER CHANGED -> UPLOAD NEW BANNER
                if (data.banner.src) {
                    // UPLOAD BANNER IMAGE
                    const bannerUrl = await uploadImage({
                        src: data.banner.src,
                        options: {
                            folder: 'bulletin',
                            upload_preset: 'hdvpsezy',
                        },
                    });
                    data.banner.src = null;
                    data.banner.url = bannerUrl;
                }

                // CHECK ARTICLE IMAGES ARE CHANGED
                await Promise.all(
                    data.images.map(async (image) => {
                        // IF IMAGE HAS SRC PROPERTY -> NEW IMAGE -> UPLOAD NEW IMAGE
                        if (image.src) {
                            const imageUrl = await uploadImage({
                                src: image.src,
                                options: {
                                    folder: 'bulletin',
                                    upload_preset: 'hdvpsezy',
                                },
                            });
                            data.images.splice(data.images.indexOf(image), 1);
                            data.images.push({
                                name: image.name,
                                url: imageUrl,
                            });
                            // data.images = [
                            //     ...data.images,
                            //     {
                            //         name: image.name,
                            //         url: imageUrl,
                            //     },
                            // ];
                        }
                    })
                );

                const bulletin = await Bulletin.findByIdAndUpdate(id, data, {
                    new: true,
                    runValidators: true,
                });
                if (!bulletin) {
                    return res.status(400).json({ success: false });
                }
                return res.status(200).json({ success: true, data: bulletin });
            } catch (error) {
                return res.status(400).json({ success: false });
            }

        case 'DELETE':
            try {
                const deletedBulletin = await Bulletin.deleteOne({ _id: id });
                if (!deletedBulletin) {
                    return res.status(400).json({ success: false });
                }
                return res.status(200).json({ success: true, data: {} });
            } catch (error) {
                res.status(400).json({ success: false });
            }

        default:
            return res.status(400).json({ success: false });
    }
}
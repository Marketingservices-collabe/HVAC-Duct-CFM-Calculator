const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

app.post('/calculate-cfm', (req, res) => {
    try {
        const { roomLength, roomWidth, ceilingHeight, ach } = req.body;

        if (!roomLength || !roomWidth || !ceilingHeight || !ach) {
            return res.status(400).json({ error: 'All input values must be provided' });
        }

        const roomArea = roomLength * roomWidth;
        const roomVolume = roomLength * roomWidth * ceilingHeight;
        const cfm = (roomVolume * ach) / 60;

        res.json({
            roomArea: roomArea.toFixed(2) + ' sqft',
            cfm: cfm.toFixed(2) + ' CFM'
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

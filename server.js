const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

app.post('/calculate', (req, res) => {
    try {
        const {
            frictionLossRate,
            tel,
            ductType,
            ductShape,
            bends45 = 0,
            bends90 = 0,
            bends180 = 0,
            calculationType,
            diameter,
            sideOne,
            sideTwo,
            cfm
        } = req.body;

        // Check for required inputs
        if (!frictionLossRate || !tel || !ductType || !ductShape || !calculationType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Equivalent length values for each type of bend
        const equivalentLength45 = 2; // in feet, example value
        const equivalentLength90 = 5; // in feet, example value
        const equivalentLength180 = 10; // in feet, example value

        // Calculate additional equivalent lengths for bends
        const additionalLength45 = bends45 * equivalentLength45;
        const additionalLength90 = bends90 * equivalentLength90;
        const additionalLength180 = bends180 * equivalentLength180;

        // Add additional lengths to TEL
        const totalTEL = tel + additionalLength45 + additionalLength90 + additionalLength180;

        const deltaP = frictionLossRate * (totalTEL / 100); // Pressure drop in in w.c.
        const deltaP_lbft2 = deltaP * 5.2; // Convert to lb/ft²
        const f = (ductType === 'metal') ? 0.02 : 0.1; // Assumed friction factors: 0.02 for metal, 0.1 for flexible
        const rho = 0.075; // Density of air in lb/ft³

        let result = {};

        if (calculationType === 'cfm') {
            let area, velocity, calculatedCFM;

            if (ductShape === 'circular') {
                if (!diameter) return res.status(400).json({ error: 'Diameter is required for circular duct' });

                area = Math.PI * Math.pow(diameter / 2, 2); // Area in ft²
            } else {
                if (!sideOne || !sideTwo) return res.status(400).json({ error: 'Both sides are required for rectangular duct' });

                area = sideOne * sideTwo; // Area in ft²
            }

            velocity = Math.sqrt((2 * deltaP_lbft2) / (f * rho)); // Velocity in fpm
            calculatedCFM = velocity * area; // CFM

            result = {
                calculatedCFM: calculatedCFM.toFixed(2) + ' CFM',
                calculatedVelocity: velocity.toFixed(2) + ' FPM'
            };
        } else if (calculationType === 'diameter') {
            if (!cfm) return res.status(400).json({ error: 'CFM is required to calculate diameter' });

            let velocity, calculatedDiameter, calculatedSideTwo;

            if (ductShape === 'circular') {
                velocity = Math.sqrt((2 * deltaP_lbft2) / (f * rho)); // Velocity in fpm
                calculatedDiameter = Math.sqrt((cfm * 4) / (Math.PI * velocity)); // Diameter in feet

                result = {
                    calculatedDiameter: calculatedDiameter.toFixed(2) + ' feet',
                    calculatedVelocity: velocity.toFixed(2) + ' FPM'
                };
            } else {
                if (!sideOne) return res.status(400).json({ error: 'Side one is required to calculate other side' });

                velocity = Math.sqrt((2 * deltaP_lbft2) / (f * rho)); // Velocity in fpm
                const area = cfm / velocity; // Area in ft²
                calculatedSideTwo = area / sideOne; // Calculate other side length

                result = {
                    calculatedSideTwo: calculatedSideTwo.toFixed(2) + ' feet',
                    calculatedVelocity: velocity.toFixed(2) + ' FPM'
                };
            }
        } else {
            return res.status(400).json({ error: 'Invalid calculation type' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

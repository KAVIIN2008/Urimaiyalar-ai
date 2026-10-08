import { Router } from 'express';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Configure Nodemailer transporter
// Replace with appropriate SMTP settings or App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // The user needs to add EMAIL_USER to .env
    pass: process.env.EMAIL_PASS // The user needs to add EMAIL_PASS to .env
  }
});

router.post('/welcome', async (req, res) => {
  const { token, role } = req.body;
  
  // Note: in a real production app, verify the token via google-auth-library
  // Here we just extract email from the JWT payload for simplicity in demo
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userEmail = payload.email;
    const userName = payload.name;

    const mailOptions = {
      from: `"Urimaiyalar AI" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Urimaiyalar OS! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #059669;">Welcome, ${userName}!</h2>
          <p style="color: #334155; font-size: 16px;">
            Thank you for joining <strong>Urimaiyalar OS</strong> as a <strong>${role}</strong>.
          </p>
          <p style="color: #334155; font-size: 16px;">
            Your AI-Powered Business Intelligence CFO is now ready to assist you. Start exploring the dashboard, managing inventory, and tracking sales in real-time.
          </p>
          <p style="color: #334155; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong>The Urimaiyalar Team</strong>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${userEmail}`);
    res.json({ success: true, message: 'Welcome email sent.' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, shopId: user.shopId },
      process.env.JWT_SECRET || 'urimaiyalar-secret-key-2026',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signup', async (req, res) => {
  const { email, password, name, role = 'retail' } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Associate or create shop for user
    let shop = await prisma.shop.findFirst();
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: `${name}'s Store`,
          ownerName: name,
          phone: '9842100000',
          address: 'Tamil Nadu, India',
          shopType: role.toUpperCase(),
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        role,
        shopId: shop.id,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, shopId: user.shopId },
      process.env.JWT_SECRET || 'urimaiyalar-secret-key-2026',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

export default router;

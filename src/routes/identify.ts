import { Router, Request, Response } from 'express';
import { identifyContact } from '../services/identityService';

const router = Router();

router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'email or phoneNumber is required' });
    }

    const result = await identifyContact(
      email ?? undefined,
      phoneNumber ? String(phoneNumber) : undefined
    );

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
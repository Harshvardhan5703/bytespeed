import Contact, { IContact } from '../models/Contact';

export async function identifyContact(email?: string, phoneNumber?: string) {
  // 1. Find all contacts matching email OR phone
  const query: any[] = [];
  if (email) query.push({ email });
  if (phoneNumber) query.push({ phoneNumber });

  if (query.length === 0) throw new Error('email or phoneNumber required');

  const matches = await Contact.find({ $or: query, deletedAt: null });

  // 2. No match → create new primary
  if (matches.length === 0) {
    const newContact = await Contact.create({
      email: email || null,
      phoneNumber: phoneNumber || null,
      linkPrecedence: 'primary',
    });
    return buildResponse([newContact]);
  }

  // 3. Collect all primary IDs from matched contacts
  const primaryIds = new Set<number>();
  for (const c of matches) {
    if (c.linkPrecedence === 'primary') primaryIds.add(c.numericId);
    else if (c.linkedId) primaryIds.add(c.linkedId);
  }

  // 4. Fetch all primaries and their secondaries
  const primaries = await Contact.find({
    numericId: { $in: [...primaryIds] },
    deletedAt: null,
  });

  // 5. If two separate primaries are now linked → older stays primary
  let truePrimary = primaries.reduce((oldest, c) =>
    c.createdAt < oldest.createdAt ? c : oldest
  );

  // Demote other primaries to secondary
  for (const p of primaries) {
    if (p.numericId !== truePrimary.numericId) {
      p.linkPrecedence = 'secondary';
      p.linkedId = truePrimary.numericId;
      await p.save();
    }
  }

  // 6. Fetch full cluster (all secondaries under truePrimary)
  const allSecondaries = await Contact.find({
    linkedId: truePrimary.numericId,
    deletedAt: null,
  });
  const allContacts = [truePrimary, ...allSecondaries];

  // 7. Check if incoming info is brand new → create secondary
  const existingEmails = new Set(allContacts.map(c => c.email).filter(Boolean));
  const existingPhones = new Set(allContacts.map(c => c.phoneNumber).filter(Boolean));

  const isNewEmail = email && !existingEmails.has(email);
  const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  if (isNewEmail || isNewPhone) {
    const secondary = await Contact.create({
      email: email || null,
      phoneNumber: phoneNumber || null,
      linkedId: truePrimary.numericId,
      linkPrecedence: 'secondary',
    });
    allContacts.push(secondary);
  }

  return buildResponse(allContacts);
}

function buildResponse(contacts: IContact[]) {
  const primary = contacts.find(c => c.linkPrecedence === 'primary')!;
  const secondaries = contacts.filter(c => c.linkPrecedence === 'secondary');

  // Primary's email/phone go first, then rest (deduplicated)
  const emails = [
    ...(primary.email ? [primary.email] : []),
    ...secondaries.map(c => c.email).filter(Boolean) as string[],
  ];
  const phones = [
    ...(primary.phoneNumber ? [primary.phoneNumber] : []),
    ...secondaries.map(c => c.phoneNumber).filter(Boolean) as string[],
  ];

  return {
    contact: {
      primaryContatctId: primary.numericId,
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phones)],
      secondaryContactIds: secondaries.map(c => c.numericId),
    },
  };
}
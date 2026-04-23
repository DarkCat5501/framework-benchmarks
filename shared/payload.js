function generatePayload(size) {
  const counts = { small: 10, medium: 50, large: 100, xlarge: 200 }
  const count = counts[size] || counts.medium
  
  const items = []
  for (let i = 0; i < count; i++) {
    items.push({
      id: `usr_${String(i).padStart(4, '0')}`,
      fullName: `User Name ${i}`.repeat(3).slice(0, 45),
      email: `user${i}@example.com`,
      age: 20 + (i % 50),
      address: {
        street: `${i * 100 + 1} Main Street`.padEnd(40),
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston'][i % 4],
        state: ['NY', 'CA', 'IL', 'TX'][i % 4],
        zip: `${10000 + i}`,
        country: 'USA'
      },
      phone: `+1-555-${String(i).padStart(4, '0')}`,
      createdAt: new Date(2024, 0, 1 + i).toISOString(),
      lastLogin: new Date(2024, 5, 1 + i).toISOString(),
      preferences: {
        theme: ['dark', 'light'][i % 2],
        lang: 'en-US',
        notifications: i % 2 === 0,
        newsletter: false
      },
      tags: ['user', 'member', 'active'].slice(0, (i % 3) + 1),
      metadata: {
        loginCount: (i * 7) % 100,
        referredBy: 'direct',
        accountType: ['free', 'premium', 'enterprise'][i % 3]
      }
    })
  }
  return JSON.stringify({ users: items, meta: { version: '1.0', count } })
}

export function getPayload(size = 'medium') {
  return generatePayload(size)
}

export function processData(body) {
  if (!body.users) return { error: 'no data' }
  
  const summary = body.users.map(user => ({
    id: user.id,
    name: user.fullName,
    city: user.address?.city,
    tier: user.metadata?.accountType,
    active: user.tags?.includes('active'),
    lastLogin: user.lastLogin
  }))
  
  const stats = {
    total: body.users.length,
    byTier: body.users.reduce((acc, u) => {
      const t = u.metadata?.accountType || 'unknown'
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {}),
    avgAge: body.users.reduce((sum, u) => sum + (u.age || 0), 0) / body.users.length
  }
  
  return { summary, stats }
}

export function getPayloadSizes() {
  return {
    small: Buffer.byteLength(getPayload('small'), 'utf8'),
    medium: Buffer.byteLength(getPayload('medium'), 'utf8'),
    large: Buffer.byteLength(getPayload('large'), 'utf8'),
    xlarge: Buffer.byteLength(getPayload('xlarge'), 'utf8')
  }
}

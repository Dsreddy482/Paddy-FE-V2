// Simulated delay to mimic network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated user database
const users = new Map([
  ['1', {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+91 98765 43210',
    role: 'Vendor',
    joinedDate: 'March 15, 2024',
    location: 'Hyderabad, India'
  }],
  ['2', {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '+91 98765 43211',
    role: 'Rythu',
    joinedDate: 'March 14, 2024',
    location: 'Bangalore, India'
  }],
  ['3', {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    password: 'password123',
    phone: '+91 98765 43212',
    role: 'Vendor',
    joinedDate: 'March 13, 2024',
    location: 'Mumbai, India'
  }]
]);

export const mockApi = {
  async searchUsers(query: string) {
    await delay(300);

    const searchQuery = query.toLowerCase();
    return Array.from(users.values())
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery) ||
        user.phone.replace(/\s+/g, '').includes(searchQuery.replace(/\s+/g, ''))
      )
      .map(({ password, ...user }) => user);
  },

  async getDealers() {
    await delay(300);
    
    return Array.from(users.values())
      .filter(user => user.role === 'Dealer')
      .map(({ password, ...user }) => user);
  },
};
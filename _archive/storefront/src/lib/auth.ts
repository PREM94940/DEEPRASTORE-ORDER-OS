export async function requireAuth() {
  // Mock Customer Session - in production use NextAuth/Supabase Auth
  const session = { 
    id: 'mock-customer-uuid', 
    tenantId: 'mock-tenant-uuid' 
  }; 
  
  if (!session) {
    throw new Error('UNAUTHORIZED: User is not authenticated');
  }
  
  return session;
}

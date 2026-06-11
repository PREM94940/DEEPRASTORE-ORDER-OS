export class Lead {
  constructor(
    public readonly id: string,
    public readonly phone: string,
    public status: 'NEW' | 'CONTACTED' | 'CONVERTED'
  ) {}

  static create(phone: string): Lead {
    return new Lead(crypto.randomUUID(), phone, 'NEW');
  }
}

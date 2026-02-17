export class AuthResponseDto {
  accessToken: string;
  expiresIn: number;
  user: { id: string; email: string; role: string };
}

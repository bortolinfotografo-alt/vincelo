// ============================================================
// PASSPORT CONFIGURATION
// Google OAuth 2.0 Strategy
// ============================================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('../services/db');

// Google OAuth Strategy (condicionalmente carregado apenas se as variáveis estiverem presentes)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Verifica se o usuário já existe pelo email
          let user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (user) {
            // Atualiza o token do Google se necessário
            await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
              },
            });

            return done(null, user);
          }

          // Cria novo usuário com informações do Google
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos?.[0]?.value,
              googleId: profile.id,
              isActive: true,
              role: 'FREELANCER', // Role padrão para novos usuários via Google
            },
          });

          // Cria perfil de freelancer padrão
          await prisma.freelancerProfile.create({
            data: {
              userId: user.id,
              location: '',
              specialties: [],
              skills: [],
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Serialização e desserialização do usuário
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        freelancer: true,
        company: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
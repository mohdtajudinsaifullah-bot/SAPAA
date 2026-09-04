import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Tetapkan laluan awam yang tidak memerlukan log masuk
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Abaikan fail statik dan fail dalaman Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jwt|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
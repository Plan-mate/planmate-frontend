import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = request.cookies.get('pm_auth')?.value === '1';

  if (pathname === '/' && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/plan';
    return NextResponse.redirect(url);
  }

  const protectedPaths = ['/plan'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('loginRequired', '1');
    const res = NextResponse.redirect(url);
    res.cookies.set('pm_login_required', '1', { path: '/', maxAge: 60 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};



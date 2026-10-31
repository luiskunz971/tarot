import { NextResponse, type NextRequest } from "next/server";

// Protege /admin y su API con usuario y contraseña (Basic Auth).
// El usuario puede ser cualquiera; la contraseña es ADMIN_PASSWORD.
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Configurá ADMIN_PASSWORD para usar el panel de administración.", { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === password) return NextResponse.next();
    } catch {
      // encabezado inválido: pedir credenciales de nuevo
    }
  }

  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Madam Esteves admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

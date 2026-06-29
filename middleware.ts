import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, key };
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function redirectToSellerLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login/seller";
  url.searchParams.delete("seller");
  url.searchParams.delete("error");
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const { url, key } = getSupabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === "/login";
  const isSellerLogin =
    isLogin && request.nextUrl.searchParams.get("seller") === "1";
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if (!user) {
    if (isAdmin || isDashboard) {
      return redirectTo(request, "/login");
    }

    return response;
  }

  if (isSellerLogin) {
    return redirectToSellerLogin(request);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "superadmin" | "client" }>();

  if (!profile) {
    if (!isLogin) {
      return redirectTo(request, "/login");
    }

    return response;
  }

  if (isLogin) {
    return redirectTo(
      request,
      profile.role === "superadmin" ? "/admin" : "/dashboard",
    );
  }

  if (isAdmin && profile.role !== "superadmin") {
    return redirectTo(request, "/dashboard");
  }

  if (isDashboard && profile.role !== "client") {
    return redirectTo(request, "/admin");
  }

  return response;
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/dashboard/:path*"],
};

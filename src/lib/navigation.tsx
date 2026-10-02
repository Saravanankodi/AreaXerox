"use client";

import NextLink from "next/link";
import { useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, ComponentType, PropsWithChildren, ReactNode } from "react";

type RouteParams = Record<string, string | number | undefined>;
type NavigationTarget = { to: string; params?: RouteParams; replace?: boolean };

function resolvePath(to: string, params?: RouteParams) {
  return to.replace(/\$([A-Za-z0-9_]+)/g, (_match, key: string) =>
    encodeURIComponent(String(params?.[key] ?? "")),
  );
}

export function Link({
  to,
  params,
  replace,
  children,
  ...props
}: PropsWithChildren<
  { to: string; params?: RouteParams; replace?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>
>) {
  return (
    <NextLink href={resolvePath(to, params)} replace={replace} {...props}>
      {children}
    </NextLink>
  );
}

/**
 * `useCallback` is load-bearing, not a micro-optimisation: every route guard
 * lists `navigate` in its dependency array, and a new closure each render would
 * re-run those guards on every render — including the ones that redirect, which
 * then fight whatever navigation the app is actually doing.
 */
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    ({ to, params, replace }: NavigationTarget) => {
      const href = resolvePath(to, params);
      if (replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}

export function useRouterState<T>({ select }: { select: (state: { location: { pathname: string } }) => T }) {
  const pathname = usePathname();
  return select({ location: { pathname } });
}

type RouteOptions = {
  component?: ComponentType;
  head?: () => unknown;
};

export function createFileRoute(template: string) {
  return (options: RouteOptions) => ({
    options,
    useParams: () => {
      const params = useParams<Record<string, string | string[]>>();
      const names = [...template.matchAll(/\$([A-Za-z0-9_]+)/g)].map((match) => match[1]!);
      return Object.fromEntries(
        names.map((name) => {
          const value = params[name];
          return [name, Array.isArray(value) ? value[0] : value ?? ""];
        }),
      ) as Record<string, string>;
    },
    useRouteContext: () => ({}),
  });
}

export function Outlet() {
  return null;
}

export function HeadContent() {
  return null;
}

export function Scripts() {
  return null;
}

export function createRootRouteWithContext<T>() {
  return (_options: { component?: ComponentType; shellComponent?: ComponentType<{ children: ReactNode }> }) => ({
    useRouteContext: () => ({} as T),
  });
}

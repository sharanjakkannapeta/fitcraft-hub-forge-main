import { Route as RootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";

const IndexRouteUpdated = IndexRoute.update({
  path: "/",
  getParentRoute: () => RootRoute,
});

export const routeTree = RootRoute.addChildren([IndexRouteUpdated]);

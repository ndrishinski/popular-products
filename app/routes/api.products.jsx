import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { cors } from 'remix-utils/cors';

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const { admin  } = await authenticate.public.appProxy(request)

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const response = await admin.graphql(
    `#graphql
    query {
      orders(first: 200, query: "created_at:>'${twentyFourHoursAgo}' AND product_id:${productId}") {
        edges {
          node {
            id
          }
        }
      }
    }`
  );

  const responseJson = await response.json();
  const orderCount = responseJson.data.orders.edges.length;

  const newResponse = json({
    ok: true,
    message: "Success",
    data: orderCount,
  });

  return cors(request, newResponse);
};

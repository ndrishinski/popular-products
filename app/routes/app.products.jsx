import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const response = await admin.graphql(
    `#graphql
      query {
        orders(first: 250, query: "created_at:>'${yesterday}'") {
          edges {
            node {
              lineItems(first: 250) {
                edges {
                  node {
                    product {
                      id
                      title
                    }
                    quantity
                  }
                }
              }
            }
          }
        }
      }`
  );

  const responseJson = await response.json();
  const orders = responseJson.data.orders.edges;

  const productOrderCounts = orders.reduce((acc, order) => {
    order.node.lineItems.edges.forEach(lineItem => {
      const product = lineItem.node.product;
      if (product) {
        const productId = product.id;
        if (!acc[productId]) {
          acc[productId] = { title: product.title, count: 0 };
        }
        acc[productId].count += lineItem.node.quantity;
      }
    });
    return acc;
  }, {});
  
  const productsOrdered = Object.entries(productOrderCounts).map(([id, data]) => ({
    id,
    title: data.title,
    orderCount: data.count
  }));
  return {productsOrdered}
}

export default function Products() {
  const { productsOrdered } = useLoaderData();
  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: 'Product', plural: 'Products' }}
              items={productsOrdered}
              renderItem={(order) => (
                <ResourceItem
                  id={order.id}
                  name={order.name}
                  url={`/products/${order.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {order.title}
                    </Text>
                    <Text variant="bodyMd" fontWeight="bold" as="h3">
                      {order.orderCount}
                    </Text>
                  </div>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
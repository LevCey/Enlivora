import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  Thumbnail,
  Text,
  Button,
  Badge,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

const BACKEND_URL = "https://api.enlivora.com";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            featuredImage { url }
            metafield(namespace: "enlivora", key: "passport_active") { value }
            metafield2: metafield(namespace: "enlivora", key: "token_id") { value }
          }
        }
      }
    }
  `);

  const data = await response.json();
  return json({
    products: data.data.products.edges.map((e) => ({
      ...e.node,
      passportActive: e.node.metafield?.value === "true",
      tokenId: e.node.metafield2?.value,
    })),
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId");

  try {
    // Call backend to mint passport
    const res = await fetch(`${BACKEND_URL}/products/${productId.split("/").pop()}/enable-passport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    // Save metafields
    await admin.graphql(`
      mutation {
        metafieldsSet(metafields: [
          { ownerId: "${productId}", namespace: "enlivora", key: "passport_active", value: "true", type: "boolean" },
          { ownerId: "${productId}", namespace: "enlivora", key: "token_id", value: "${data.tokenId}", type: "single_line_text_field" }
        ]) {
          metafields { id }
        }
      }
    `);

    return json({ success: true, tokenId: data.tokenId, productId });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function ProductsPage() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <Page title="Enlivora Products" subtitle="Enable digital passports for your products">
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={products}
              renderItem={(item) => {
                const { id, title, featuredImage, passportActive, tokenId } = item;
                const isLoading = fetcher.state === "submitting" && fetcher.formData?.get("productId") === id;
                const justEnabled = fetcher.data?.productId === id && fetcher.data?.success;

                return (
                  <ResourceList.Item id={id} media={<Thumbnail source={featuredImage?.url || ""} alt={title} />}>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="bold">{title}</Text>
                        {(passportActive || justEnabled) && (
                          <Text variant="bodySm" tone="subdued">Token #{tokenId || fetcher.data?.tokenId}</Text>
                        )}
                      </BlockStack>
                      
                      {passportActive || justEnabled ? (
                        <Badge tone="success">✓ Passport Active</Badge>
                      ) : (
                        <fetcher.Form method="post">
                          <input type="hidden" name="productId" value={id} />
                          <Button submit loading={isLoading} variant="primary">
                            Enable Passport
                          </Button>
                        </fetcher.Form>
                      )}
                    </InlineStack>
                  </ResourceList.Item>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

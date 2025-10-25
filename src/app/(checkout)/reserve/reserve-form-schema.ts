import { z } from "zod";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

export const guestInformationSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
});

export const accountMemberInformationSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  name: z.string({ required_error: "Name is required" }),
});

export const shippingAddressSchema = z.object({
  first_name: z.string({ required_error: "First name is required" }),
  last_name: z.string({ required_error: "Last name is required" }),
  company_name: z.string().optional().or(emptyStringToUndefined),
  line_1: z.string({ required_error: "Address is required" }),
  line_2: z.string().optional().or(emptyStringToUndefined),
  city: z.string({ required_error: "City is required" }),
  county: z.string().optional().or(emptyStringToUndefined),
  region: z.string().optional().or(emptyStringToUndefined),
  postcode: z.string({ required_error: "Post code is required" }),
  country: z.string({ required_error: "Country is required" }),
  phone_number: z.string().optional().or(emptyStringToUndefined),
  instructions: z.string().optional().or(emptyStringToUndefined),
});

export const billingAddressSchema = z.object({
  first_name: z.string({ required_error: "First name is required" }),
  last_name: z.string({ required_error: "Last name is required" }),
  company_name: z.string().optional().or(emptyStringToUndefined),
  line_1: z.string({ required_error: "Address is required" }),
  line_2: z.string().optional().or(emptyStringToUndefined),
  city: z.string({ required_error: "City is required" }),
  county: z.string().optional().or(emptyStringToUndefined),
  region: z.string().optional().or(emptyStringToUndefined),
  postcode: z.string({ required_error: "Post code is required" }),
  country: z.string({ required_error: "Country is required" }),
  phone_number: z.string().optional().or(emptyStringToUndefined),
  instructions: z.string().optional().or(emptyStringToUndefined),
});

export const anonymousReserveFormSchema = z.object({
  guest: guestInformationSchema,
  shippingAddress: shippingAddressSchema,
  sameAsShipping: z.boolean().default(true),
  billingAddress: billingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type AnonymousReserveForm = z.TypeOf<typeof anonymousReserveFormSchema>;

export const accountMemberReserveFormSchema = z.object({
  account: accountMemberInformationSchema,
  shippingAddress: shippingAddressSchema,
  sameAsShipping: z.boolean().default(true),
  billingAddress: billingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type AccountMemberReserveForm = z.TypeOf<
  typeof accountMemberReserveFormSchema
>;

export type ReserveForm = AnonymousReserveForm | AccountMemberReserveForm;

import { describe, expect, test } from "vitest";
import { BundleConfigurationSelectedOptions } from "../../../react-shopper-hooks";
import {
  formSelectedOptionsToData,
  selectedOptionsToFormValues,
  FormQuantities,
} from "./form-parsers";

describe("form-parsers", () => {
  test("component options to form", () => {
    const data: BundleConfigurationSelectedOptions = {
      plants: {
        "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 1,
        "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 1,
      },
      pots: {
        "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
      },
      tools: {},
    };

    const expectedResult = {
      plants: [
        JSON.stringify({
          "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 1,
        }),
        JSON.stringify({
          "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 1,
        }),
      ],
      pots: [
        JSON.stringify({
          "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
        }),
      ],
      tools: [],
    };

    expect(selectedOptionsToFormValues(data)).toEqual(expectedResult);
  });

  test("form to component options", () => {
    const data = {
      plants: [
        JSON.stringify({
          "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 1,
        }),
        JSON.stringify({
          "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 1,
        }),
      ],
      pots: [
        JSON.stringify({
          "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
        }),
      ],
      tools: [],
    };

    const expectedResult: BundleConfigurationSelectedOptions = {
      plants: {
        "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 1,
        "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 1,
      },
      pots: {
        "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
      },
      tools: {},
    };

    expect(formSelectedOptionsToData(data)).toEqual(expectedResult);
  });

  test("form to component options with quantities", () => {
    const data = {
      plants: [
        JSON.stringify({
          "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 1,
        }),
        JSON.stringify({
          "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 1,
        }),
      ],
      pots: [
        JSON.stringify({
          "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
        }),
      ],
      tools: [],
    };

    const quantities: FormQuantities = {
      plants: {
        "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 3,
        "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 2,
      },
      pots: {
        "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
      },
    };

    const expectedResult: BundleConfigurationSelectedOptions = {
      plants: {
        "a158ffa0-5d16-4325-8dcc-be8acd55eecf": 3,
        "2131231dwadwd12-1d21d2dqw-dd12dqwdaw": 2,
      },
      pots: {
        "fc520b37-a709-4032-99b3-8d4ecc990027": 1,
      },
      tools: {},
    };

    expect(formSelectedOptionsToData(data, quantities)).toEqual(expectedResult);
  });
});

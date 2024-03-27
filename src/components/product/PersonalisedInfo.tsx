import { Field } from "formik";
import { Input } from "../input/Input";
import { Label } from "../label/Label";

interface IPersonalisedInfoProps {
  custom_inputs: any;
  formikForm?: boolean;
}

const PersonalisedInfo = ({ custom_inputs, formikForm }: IPersonalisedInfoProps): JSX.Element => {
  return (
    custom_inputs && (
      <div>
        <h2 className="mt-6 mb-4 font-bold">
          Additional Information:
        </h2>
        <div className="flex flex-row flex-wrap">
          {Object.keys(custom_inputs).map(input => {
            return (
              <div className="mr-10 mb-4" key={input}>
                <Label htmlFor={input}>{custom_inputs[input].name}</Label>
                <div className="mt-2">
                  {formikForm ? (
                    <Field
                      id={input}
                      name={input}
                      required={custom_inputs[input].required}
                      className="flex w-full text-black/80 rounded-lg border border-input border-black/40 focus-visible:ring-0 focus-visible:border-black bg-background disabled:cursor-not-allowed disabled:opacity-50 leading-[1.6rem] px-4 py-[0.78rem]"
                    />
                  ) : (
                    <Input
                      id={input}
                      name={input}
                      type="text"
                      required={custom_inputs[input].required}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  );
};

export default PersonalisedInfo;

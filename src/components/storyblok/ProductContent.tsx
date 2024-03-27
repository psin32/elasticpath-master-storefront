import { storyblokEditable } from "@storyblok/react";
import { render, NODE_UL, NODE_LI, NODE_PARAGRAPH, NODE_HR, NODE_HEADING } from 'storyblok-rich-text-react-renderer';
import { Tab } from '@headlessui/react'

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

const ProductContent = ({ blok }: any) => {
  return (
    <div {...storyblokEditable(blok)}>
      <div className="bg-[#fcfaf4] p-10 border-[#d6c679] border-[1px] mt-4 text-xl leading-9">
        {render(blok.content, {
          nodeResolvers: {
            [NODE_UL]: (children) => <ul className="mt-4 mb-4">{children}</ul>,
                    [NODE_LI]: (children) => <li className="ml-10 list-disc">{children}</li>,
                    [NODE_PARAGRAPH]: (children) => <p className="mt-2">{children}</p>,
                    [NODE_HR]: () => <hr className="mt-4 mb-4 border-[1px] border-gray-300" />,
                    [NODE_HEADING]: (children, { level }) => level == 3
                      ? <h3 className="text-2xl mt-4">{children}</h3>
                      : level == 4
                        ? <h4 className="text-xl mt-2 mb-4">{children}</h4>
                        : <h1>{children}</h1>,
          }
        })}
      </div>

      <div className="w-full max-w-3xl px-2 py-16 sm:px-0">
        <Tab.Group>
          <Tab.List className="flex space-x-1 ">
            {blok.tabs.map((nestedBlok: any) => (
              <Tab
                key={nestedBlok.tab_id}
                className={({ selected }) =>
                  classNames(
                    'w-full py-2.5 text-[17px] leading-5',
                    'focus:outline-none',
                    selected
                      ? 'bg-white font-medium  text-[#004d71] border-b-2 py-4 px-1 border-[#004d71]'
                      : 'text-black hover:bg-white/[0.12] hover:text-primary-300'
                  )
                }
              >
                {nestedBlok.tab_title}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {blok.tabs.map((nestedBlok: any) => (
              <Tab.Panel
                key={nestedBlok.tab_id}
                className={classNames(
                  'rounded-xl bg-white p-3',
                  'focus:outline-none'
                )}
              >
                {render(nestedBlok.tab_content, {
                  nodeResolvers: {
                    [NODE_UL]: (children) => <ul className="mt-4 mb-4">{children}</ul>,
                    [NODE_LI]: (children) => <li className="ml-10 list-disc">{children}</li>,
                    [NODE_PARAGRAPH]: (children) => <p className="mt-2">{children}</p>,
                    [NODE_HR]: () => <hr className="mt-4 mb-4 border-[1px] border-gray-300" />,
                    [NODE_HEADING]: (children, { level }) => level == 3
                      ? <h3 className="text-2xl mt-4">{children}</h3>
                      : level == 4
                        ? <h4 className="text-xl mt-2 mb-4">{children}</h4>
                        : <h1>{children}</h1>,
                  }
                })}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

    </div>
  );
};

export default ProductContent;

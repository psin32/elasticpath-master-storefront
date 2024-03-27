import { render } from 'storyblok-rich-text-react-renderer';
import { storyblokEditable } from "@storyblok/react";

const RichText = ({ blok }: any) => (
    <div {...storyblokEditable(blok)}>
        {render(blok.long_text)}
    </div>
)

export default RichText

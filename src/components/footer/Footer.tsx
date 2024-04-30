import { getFooter } from "../../services/storyblok";
import Content from "../storyblok/Content";

const Footer = async () => {
  const content = await getFooter();
  return (
    <Content content={content}></Content>
  )
}

export default Footer;

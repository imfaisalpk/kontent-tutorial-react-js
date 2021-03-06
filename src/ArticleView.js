import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import { client } from './config';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { resolveContentLink } from './linkResolver';
import { resolveItemInRichText } from './itemResolver';

let unsubscribeSubject = new Subject();

class ArticleView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      article: null,
    };
  }

  fetchArticle(slug) {
    client.items()
      .type('article')
      .equalsFilter('elements.url_pattern', slug)
      .depthParameter(1)
      .queryConfig({
        urlSlugResolver: resolveContentLink,
        richTextResolver: resolveItemInRichText,
      })
      .toObservable()
      .pipe(takeUntil(unsubscribeSubject))
      .subscribe((response) => {
        console.log(response.items[0]);
        this.setState({
          loaded: true,
          article: response.items[0]
        });
      });
  }

  handleClick(event, richTextElement) {
    if (event.target.tagName === 'A' && event.target.hasAttribute('data-item-id')) {
      event.preventDefault();

      const id = event.target.getAttribute('data-item-id');
      const link = richTextElement.links.find(link => link.linkId === id);
      const newPath = resolveContentLink(link).url;
      if (newPath) {
        this.props.history.push(newPath);
      }
    }
  }

  componentDidMount() {
    let slug = this.props.match.params.slug;
    this.fetchArticle(slug);
  }

  componentDidUpdate(oldprops) {
    let oldSlug = oldprops.match.params.slug;
    let newSlug = this.props.match.params.slug;
    if (oldSlug !== newSlug) {
      this.fetchArticle(newSlug);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  unsubscribe() {
    unsubscribeSubject.next();
    unsubscribeSubject.complete();
  }

  render = (props) => {
    if (this.state.loaded) {
      const article = this.state.article;
      const title = article.title.value;
      const bodyCopy = article.body_copy;

      return (
        <div>
          <Link to="/">Home</Link>
          <h1>{title}</h1>
          <div className="article_body"
            dangerouslySetInnerHTML={{ __html: bodyCopy.resolveHtml() }}
            onClick={event => this.handleClick(event, bodyCopy)} />
        </div>
      );
    } else {
      return (
        <div>
          Loading...
        </div>
      );
    }
  }
}

export default ArticleView;
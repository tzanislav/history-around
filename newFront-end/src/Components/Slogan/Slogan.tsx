import './Slogan.css'

type SloganProps = {
  text: string
  emphasis?: string
}

function Slogan({ text, emphasis }: SloganProps) {
  return (
    <div className="slogan">
      <p className="slogan__kicker">History Around</p>
      <h1 className="slogan__headline">
        {text}
        {emphasis ? <span className="slogan__emphasis"> {emphasis}</span> : null}
      </h1>
    </div>
  )
}

export default Slogan

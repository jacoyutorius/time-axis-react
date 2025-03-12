import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Tabs, Tab, Button, Image, Container, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignCenter, faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import * as d3 from 'd3';
import { useRecords } from '../context/RecordsContext';

function TimeAxis() {
  const {
    peoples,
    organizations,
    chartData,
    eventData,
    areaStartYear,
    areaEndYear,
    toggleSelected
  } = useRecords();

  const [showModal, setShowModal] = useState(false);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [lineMode, setLineMode] = useState('chronicle'); // chronicle or alignLeft
  const svgRef = useRef(null);

  const colorMapping = {
    people: '#364f6b',
    organization: '#364f6b'
  };

  // タイムラインのタイトルと期間
  const timelineTitle = '';
  const historyRange = `A.D. ${areaStartYear()} ~ ${areaEndYear()}`;
  const dataSelected = chartData.length > 0;
  const areaPeriod = lineMode === 'alignLeft' ? 100 : areaEndYear() - areaStartYear();

  // 人物の選択
  const handlePeopleSelect = async (people) => {
    await toggleSelected(people);
    renderChart();
  };

  // 組織の選択
  const handleOrganizationSelect = async (organization) => {
    await toggleSelected(organization);
    renderChart();
  };

  // 生誕年に合わせるモード
  const handleChronicleMode = () => {
    setLineMode('chronicle');
    setTimeout(() => {
      renderChart();
    }, 500);
  };

  // 同じラインに並べるモード
  const handleAlignLeftMode = () => {
    setLineMode('alignLeft');
    setTimeout(() => {
      renderChart();
    }, 500);
  };

  // 描画開始点のX座標を計算
  const calcStartX = (d) => {
    if (lineMode === 'alignLeft') {
      return 100;
    } else {
      return Math.abs((window.innerWidth - 40) * (d.start - areaStartYear()) / areaPeriod) + 5;
    }
  };

  // 描画終了点のX座標を計算
  const calcEndX = (d) => {
    if (lineMode === 'alignLeft') {
      const age = (d.end === 0 || d.end === undefined ? new Date().getFullYear() : d.end) - d.start;
      return Math.abs((window.innerWidth - 40) * age / areaPeriod) + 100;
    } else {
      const end = d.end === undefined ? new Date().getFullYear() : d.end;
      return Math.abs((window.innerWidth - 40) * (end - areaStartYear()) / areaPeriod) - 10;
    }
  };

  // 実際の描画用のX座標を計算（ラインの描画用）
  const calcLineX2 = (d) => {
    if (lineMode === 'alignLeft') {
      const age = (d.end === 0 || d.end === undefined ? new Date().getFullYear() : d.end) - d.start;
      // 最低でも200ピクセル以上の長さを確保
      return 300;
    } else {
      return calcEndX(d);
    }
  };

  // イベントポイントのX座標を計算
  const calcCircleX = (d) => {
    if (lineMode === 'alignLeft') {
      // 同じラインに並べるモードの場合、イベントの年と人物の生誕年の差を計算し、
      // その差に基づいて位置を決定（100pxを基準点として）
      const baseRecord = chartData[d.baseIndex];
      const yearDiff = d.start - baseRecord.start;
      // 1年あたり4pxとして計算
      return 100 + yearDiff * 4;
    } else {
      return Math.abs((window.innerWidth - 40) * (d.start - areaStartYear()) / areaPeriod) + 5;
    }
  };

  // 各レコードを描画するY座標を計算
  const calcTopY = (index) => {
    return (index + 1) * 60;
  };

  // チャートの描画
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderChart = useCallback(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth - 40;
    const height = chartData.length * 50 + 250;

    // 以前のSVGを削除
    d3.select(svgRef.current).select('.svg').remove();

    const svg = d3.select(svgRef.current)
      .append('svg')
      .attr('class', 'svg')
      .attr('width', width)
      .attr('height', height);

    // ライン
    if (lineMode === 'alignLeft') {
      // 同じラインに並べるモードの場合は、各人物の生誕から没年に基づいてラインの長さを決定
      svg.selectAll('.timeline-line')
        .data(chartData)
        .enter()
        .append('line')
        .attr('class', 'timeline-line')
        .attr('x1', 100)
        .attr('y1', (d, i) => calcTopY(i))
        .attr('x2', 100)
        .attr('y2', (d, i) => calcTopY(i))
        .attr('stroke-width', 3)
        .attr('stroke', d => colorMapping[d.category])
        .transition()
        .duration(1000)
        .attr('x2', d => {
          // 生誕から没年までの期間を計算
          const end = d.end === 0 || d.end === undefined ? new Date().getFullYear() : d.end;
          const lifespan = end - d.start;
          // 1年あたり4pxとして計算
          return 100 + lifespan * 4;
        });
    } else {
      // 生誕年に合わせるモードの場合は、通常のラインを描画
      svg.selectAll('.timeline-line')
        .data(chartData)
        .enter()
        .append('line')
        .attr('class', 'timeline-line')
        .attr('x1', d => calcStartX(d))
        .attr('y1', (d, i) => calcTopY(i))
        .attr('x2', d => calcStartX(d))
        .attr('y2', (d, i) => calcTopY(i))
        .attr('stroke-width', 3)
        .attr('stroke', d => colorMapping[d.category])
        .transition()
        .duration(1000)
        .attr('x2', d => calcEndX(d));
    }

    // 開始点
    svg.selectAll('.startYear')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'startYear')
      .attr('r', 0)
      .attr('cx', d => calcStartX(d))
      .attr('cy', (d, i) => calcTopY(i))
      .transition()
      .duration(1500)
      .attr('r', 5)
      .attr('fill', d => colorMapping[d.category])
      .attr('cx', d => calcStartX(d))
      .attr('cy', (d, i) => calcTopY(i));

    // 終了点
    svg.selectAll('.endYear')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'endYear')
      .attr('r', 0)
      .attr('cx', d => calcEndX(d))
      .attr('cy', (d, i) => calcTopY(i))
      .transition()
      .duration(1500)
      .attr('r', 5)
      .attr('fill', d => colorMapping[d.category])
      .attr('cx', d => calcEndX(d))
      .attr('cy', (d, i) => calcTopY(i));

    // 開始点のマウスオーバー
    svg.selectAll('.startYear')
      .on('mouseover', function(event, d) {
        const coordinates = d3.pointer(event);
        svg.append('text')
          .text(d.start)
          .attr('id', 'startPoint')
          .attr('fill', 'gray')
          .attr('x', coordinates[0])
          .attr('y', calcTopY(chartData.indexOf(d)) + 20)
          .attr('font-size', 14);
      })
      .on('mouseout', function() {
        svg.select('#startPoint').remove();
      });

    // 終了点のマウスオーバー
    svg.selectAll('.endYear')
      .on('mouseover', function(event, d) {
        const coordinates = d3.pointer(event);
        svg.append('text')
          .text(d.end)
          .attr('id', 'endPoint')
          .attr('fill', 'gray')
          .attr('x', coordinates[0])
          .attr('y', calcTopY(chartData.indexOf(d)) + 20)
          .attr('font-size', 14);
      })
      .on('mouseout', function() {
        svg.select('#endPoint').remove();
      });

    // テキスト
    svg.selectAll('.timeline-text')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'timeline-text')
      .attr('x', d => calcStartX(d) - 30)
      .attr('y', (d, i) => calcTopY(i) - 12)
      .transition()
      .duration(1500)
      .text(d => `${d.name} (${d.start} ~ ${d.end})`)
      .attr('fill', 'black')
      .attr('x', d => calcStartX(d))
      .attr('y', (d, i) => calcTopY(i) - 12)
      .attr('font-size', 14);

    // サムネイル
    svg.selectAll('.thumb')
      .data(chartData)
      .enter()
      .append('image')
      .attr('class', 'thumb')
      .attr('href', d => d.imageUrl)
      .attr('x', d => calcStartX(d) - 50)
      .attr('y', (d, i) => calcTopY(i) - 20)
      .attr('width', '40')
      .attr('height', '40');

    // サムネイルのマウスオーバー
    svg.selectAll('.thumb')
      .on('mouseover', function(event, d) {
        const coordinates = d3.pointer(event);
        svg.select('#focusedImage').remove();
        svg.append('image')
          .attr('id', 'focusedImage')
          .attr('href', d.imageUrl)
          .attr('x', coordinates[0] - 20)
          .attr('y', coordinates[1])
          .attr('width', 220)
          .attr('height', 220);
      })
      .on('mouseout', function() {
        svg.select('#focusedImage').remove();
      });

    // イベントポイント
    svg.selectAll('.eventPoint')
      .data(eventData)
      .enter()
      .append('circle')
      .attr('class', 'eventPoint')
      .attr('r', 0)
      .attr('cx', d => calcCircleX(d))
      .attr('cy', d => calcTopY(d.baseIndex))
      .transition()
      .duration(2500)
      .attr('r', 5)
      .attr('fill', '#fc5185')
      .attr('cx', d => calcCircleX(d))
      .attr('cy', d => calcTopY(d.baseIndex));

    // イベントポイントのマウスオーバー
    svg.selectAll('.eventPoint')
      .on('mouseover', function(event, d) {
        const coordinates = d3.pointer(event);
        svg.append('text')
          .text(`${d.start} : ${d.content}`)
          .attr('id', 'eventContent')
          .attr('fill', 'gray')
          .attr('x', coordinates[0])
          .attr('y', calcTopY(d.baseIndex) - 10)
          .attr('font-size', 14);
      })
      .on('mouseout', function() {
        svg.select('#eventContent').remove();
      });

    // クリックイベント
    svg.on('click', function(event) {
      svg.select('.latitudeLine').remove();
      const coordinates = d3.pointer(event);
      svg.append('line')
        .attr('class', 'latitudeLine')
        .attr('x1', coordinates[0])
        .attr('y1', 0)
        .attr('x2', coordinates[0])
        .attr('y2', height)
        .style('stroke-opacity', 0.2)
        .attr('stroke-width', 0.3)
        .attr('stroke', 'black');

      svg.selectAll('.circle2').remove();
      svg.selectAll('.circle2')
        .data(chartData)
        .enter()
        .append('circle')
        .attr('class', 'circle2')
        .attr('r', 2.5)
        .attr('fill', 'black')
        .attr('cx', coordinates[0])
        .attr('cy', (d, i) => calcTopY(i));

      svg.selectAll('.text2').remove();
      svg.selectAll('.text2')
        .data(chartData)
        .enter()
        .append('text')
        .attr('class', 'text2')
        .attr('x', coordinates[0] - 30)
        .attr('y', (d, i) => calcTopY(i) + 17)
        .attr('fill', 'white')
        .transition()
        .duration(150)
        .attr('fill', 'grey')
        .text(d => {
          if (d.category === 'people') {
            // X座標とhistoryラインの交点におけるターゲットの年齢を算出
            let startX = calcStartX(d);
            const v = coordinates[0] - startX;
            const scale = areaPeriod / width;
            let age = Math.round(v * scale);

            // 左揃えにしたときの年齢計算
            if (lineMode === 'alignLeft') {
              // クリックした位置のX座標から年を計算
              const clickedYear = Math.round((coordinates[0] - 100) / 4) + d.start;
              // その年における人物の年齢を計算
              age = clickedYear - d.start;
            }

            return `Age : ${age}`;
          } else {
            return '';
          }
        })
        .attr('x', coordinates[0] + 5)
        .attr('y', (d, i) => calcTopY(i) + 17)
        .attr('font-size', 14);
    });
  }, [chartData, lineMode, areaStartYear, areaEndYear, colorMapping, eventData, svgRef]);

  // コンポーネントがマウントされたときにレコードを読み込む
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  return (
    <section id="time-axis">
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Body>
          <Tabs defaultActiveKey="people">
            <Tab eventKey="people" title="People">
              <table className="table">
                <tbody>
                  {peoples.map(people => (
                    <tr key={people.name}>
                      <td>
                        <input
                          type="checkbox"
                          checked={chartData.some(item => item.id === people.id)}
                          onChange={() => handlePeopleSelect(people)}
                        />
                      </td>
                      <td>
                        <Image
                          rounded
                          width="45"
                          height="45"
                          src={people.imageUrl}
                          alt="img"
                        />
                      </td>
                      <td>{people.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab>
            <Tab eventKey="organization" title="Organization">
              <table className="table">
                <tbody>
                  {organizations.map(organization => (
                    <tr key={organization.name}>
                      <td>
                        <input
                          type="checkbox"
                          checked={chartData.some(item => item.id === organization.id)}
                          onChange={() => handleOrganizationSelect(organization)}
                        />
                      </td>
                      <td>
                        <Image
                          rounded
                          width="45"
                          height="45"
                          src={organization.imageUrl}
                          alt="img"
                        />
                      </td>
                      <td>{organization.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {error && (
        <Container fluid>
          <Alert variant="danger" dismissible>
            <Alert.Heading>{error.message}</Alert.Heading>
            <hr />
            <p>{error.stack}</p>
          </Alert>
        </Container>
      )}

      {loading && (
        <Container fluid>
          <Alert variant="info">
            <Alert.Heading>
              Loading...
              <i className="fa fa-spinner fa-spin"></i>
            </Alert.Heading>
          </Alert>
        </Container>
      )}

      {!loading && (
        <Container fluid>
          {dataSelected ? (
            <>
              <h2>{timelineTitle} {historyRange}</h2>
              <span>
                <Button variant="outline-success" onClick={() => setShowModal(true)}>
                  Select Timeline
                </Button>
              </span>

              <Button
                size="sm"
                variant={lineMode === 'chronicle' ? 'primary' : 'outline-primary'}
                onClick={handleChronicleMode}
              >
                <FontAwesomeIcon icon={faAlignCenter} /> 生誕年に合わせる
              </Button>
              <Button
                size="sm"
                variant={lineMode === 'alignLeft' ? 'primary' : 'outline-primary'}
                onClick={handleAlignLeftMode}
                className="ms-2"
              >
                <FontAwesomeIcon icon={faAlignLeft} /> 同じラインに並べる
              </Button>
              <div ref={svgRef} className="mt-3"></div>
            </>
          ) : (
            <Alert variant="light">
              <Alert.Heading>No data selected.</Alert.Heading>
              <p>タイムラインに表示するデータを選択してください。</p>
              <p>select Timeline data.</p>
              <hr />
              <p className="mb-0">
                <Button variant="outline-success" onClick={() => setShowModal(true)}>
                  SELECT
                </Button>
              </p>
            </Alert>
          )}
        </Container>
      )}
    </section>
  );
}

export default TimeAxis;
